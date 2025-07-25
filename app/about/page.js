import Link from "next/link";

export default function About() {
  return (
    <main>
      <h1>このアプリについて</h1>
      <p>これはNext.jsとVercelのハンズオンのために作成されました。</p>
      <p><Link href="/"><a>トップページに戻る</a></Link></p>
    </main>
  );
}