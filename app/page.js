"use client"; // これを追加してClient Componentにする

import { useState, useEffect } from 'react';
import Link from 'next/link'; // aboutページへのリンク用にインポート

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTodos() {
      try {
        const response = await fetch('/api/todos'); // API Routeを呼び出す
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTodos(data);
      } catch (e) {
        console.error("Failed to fetch todos:", e);
        setError("データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    }

    fetchTodos();
  }, []); // 空の依存配列でコンポーネントのマウント時に一度だけ実行

  if (loading) return <p>Loading todos...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <main style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333' }}>ようこそ！My First Next.js Appへ</h1>
      <p>これは私の初めてのWebアプリケーションです。</p>
      <p>Vercelにデプロイしてみよう！</p>
      <p>🎉 コードを変更して自動デプロイを体験しよう！ 🎉</p>

      <h2 style={{ marginTop: '30px', color: '#555' }}>My To-Do List (from Supabase)</h2>
      {todos.length === 0 ? (
        <p>まだTo-Doがありません。</p>
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
              {todo.task} {todo.is_completed && '(完了)'}
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