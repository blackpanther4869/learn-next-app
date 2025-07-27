"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import AuthForm from '@/components/AuthForm';

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true); // アプリケーション全体の初期ロード状態
  const [fetchError, setFetchError] = useState(null); // データフェッチのエラー
  const [session, setSession] = useState(null); // 認証セッション
  const [newTask, setNewTask] = useState('');

  // To-Doリストのフェッチ関数 (useCallback でメモ化)
  // session が変更されたときのみこの関数が「新しい関数」として再生成される
  const fetchTodos = useCallback(async () => {
    setFetchError(null); // フェッチ開始時にエラーをリセット
    try {
      if (session?.user?.id) { // ログインユーザーがいる場合のみ
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching todos:', error.message);
          throw new Error(error.message);
        }
        setTodos(data);
      } else {
        // ログインしていない場合はTo-Doをクリア
        setTodos([]); // ★ここが重要: sessionがない場合は必ずtodosをクリア
      }
    } catch (e) {
      console.error("Failed to fetch todos:", e);
      setFetchError("データの取得に失敗しました。");
    } finally {
      setLoading(false); // ★フェッチ完了時にローディングを解除
    }
  }, [session]); // session のみが依存

  // 1. 認証状態の監視と初期セッションの取得
  useEffect(() => {
    let isMounted = true; // コンポーネントがマウントされているか追跡するフラグ

    // コンポーネントがマウントされたらすぐにセッションを試みる
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        // 初期セッション取得後、fetchTodos が呼ばれるのを待つ
        // fetchTodos の finally で setLoading(false) される
      }
    });

    // 認証状態の変化を購読
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isMounted) {
          setSession(session); // セッションステートを更新
          // 認証状態が変化したら、UIを再度ローディング状態にし、
          // fetchTodos（次のuseEffectで発火）でデータを再取得し、ローディング解除させる
          setLoading(true); // ★認証状態が変化した際にローディングをtrueに戻す
        }
      }
    );

    // クリーンアップ関数
    return () => {
      isMounted = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []); // コンポーネントのマウント時に一度だけ実行

  // 2. session の変更と loading (初期ロード完了) に応じて To-Do をフェッチ
  useEffect(() => {
    // loading が true のままになっている場合（初期ロード中や認証状態変化後）
    // かつ session が確定している（null またはオブジェクト）場合にのみ fetchTodos を実行
    // fetchTodos が内部で setLoading(false) を呼ぶため、このループは停止する
    // session が undefined でないことを確認する
    if (loading && session !== undefined) {
      fetchTodos();
    }
  }, [session, loading, fetchTodos]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    // ログイン済みかつ、タスクが空でないことを確認
    if (!newTask.trim() || !session?.user?.id) return;

    setLoading(true); // タスク追加中はローディング状態に
    setFetchError(null);

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([
          { task: newTask, user_id: session.user.id } // ★user_id を含める
        ])
        .select(); // 挿入されたレコードを取得

      if (error) {
        console.error('Error adding todo:', error.message);
        throw new Error(error.message);
      }

      setTodos((prevTodos) => [...prevTodos, data[0]]); // UIに新しいTo-Doを追加
      setNewTask(''); // 入力フィールドをクリア
    } catch (e) {
      console.error("Failed to add todo:", e);
      setFetchError("To-Doの追加に失敗しました。");
    } finally {
      setLoading(false); // タスク追加完了
    }
  };

  const handleDeleteTask = async (id) => {
    setLoading(true); // 削除中はローディング状態に
    setFetchError(null);
    try {
      // Supabaseから指定されたIDのTo-Doを削除
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id) // 指定されたIDのレコードをターゲット
        .eq('user_id', session.user.id); // ★RLSのためにuser_idも条件に含める（必須ではないが安全策）

      if (error) {
        console.error('Error deleting todo:', error.message);
        throw new Error(error.message);
      }

      // UIから削除されたTo-Doを除外
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
    } catch (e) {
      console.error("Failed to delete todo:", e);
      setFetchError("To-Doの削除に失敗しました。");
    } finally {
      setLoading(false); // 削除完了
    }
  };

  const handleSignOut = async () => {
    setLoading(true); // ログアウト処理中はローディング状態に
    setFetchError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('ログアウトエラー:', error.message);
      setFetchError('ログアウトに失敗しました。');
      setLoading(false); // エラー時もローディング解除
    } else {
      console.log('ログアウトしました。');
      // ここで session ステートを null に設定することで、
      // session に依存する useEffect と fetchTodos が確実に再実行される
      setSession(null); // ★ここが最重要: ログアウト時に session を null に設定
      setNewTask('');
      // setLoading(false) は fetchTodos の中で行われるか、
      // session が null になることでfetchTodosが呼ばれるので、基本的には不要
      // ただし、もしfetchTodosが何らかの理由で呼ばれないパスがあるならここで解除が必要
      // 現在のロジックでは fetchTodos が呼ばれるので、そのfinallyで解除されます。
    }
  };


  // UI表示の切り替え
  if (loading) {
    return <p>Loading application...</p>;
  }

  return (
    <main style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333' }}>ようこそ！My First Next.js Appへ</h1>

      {!session ? (
        <AuthForm />
      ) : (
        <>
          <div style={{
            backgroundColor: '#e6f7ff',
            border: '1px solid #91d5ff',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 10px 0', color: '#0050b3' }}>
              こんにちは、<strong>{session.user.email}</strong> さん！
            </p>
            <button
              onClick={handleSignOut}
              disabled={loading}
              style={{
                padding: '8px 15px',
                backgroundColor: '#f5222d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '処理中...' : 'ログアウト'}
            </button>
          </div>

          <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <input
              type="text"
              placeholder="新しいTo-Doを入力"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              style={{ flexGrow: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '追加中...' : '追加'}
            </button>
          </form>
        </>
      )}

      <h2 style={{ marginTop: '30px', color: '#555' }}>My To-Do List (from Supabase)</h2>
      {fetchError && <p style={{ color: 'red' }}>Error: {fetchError}</p>}
      {todos.length === 0 ? (
        <p>{session ? 'まだTo-Doがありません。' : 'ログインしてあなたのTo-Doを表示・追加してください。'}</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {todos.map((todo) => (
            <li key={todo.id} style={{
              backgroundColor: '#f9f9f9',
              border: '1px solid #ddd',
              borderRadius: '5px',
              padding: '10px',
              marginBottom: '8px',
              textDecoration: todo.is_completed ? 'line-through' : 'none',
              color: todo.is_completed ? '#888' : '#333'
            }}>
              <span style={{ flexGrow: 1 }}>{todo.task} {todo.is_completed && '(完了)'}</span>
              <button
                onClick={() => handleDeleteTask(todo.id)}
                disabled={loading}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#f5222d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  marginLeft: '10px' // ボタンとテキストの間にスペース
                }}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: '20px' }}>
        <Link href="/about" style={{ color: '#0070f3', textDecoration: 'none' }}>このアプリについて</Link>
      </p>
    </main>
  );
}