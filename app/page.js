import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main>
      <h1>ようこそ！ Next.js Appへ</h1>
      <p>これは私の初めてのWebアプリケーションです。</p>
      <p>Vercelにデプロイしてみよう！</p>
      <p>🎉 コードを変更して自動デプロイを体験しよう！ 🎉</p> {/* この行を追加 */}
      <p><a href="/about">このアプリについて</a></p> {/* aboutページへのリンクを追加 */}
    </main>
  );
}