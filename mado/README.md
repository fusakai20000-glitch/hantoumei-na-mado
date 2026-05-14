# 窓 — プロトタイプ

最小構成の静的サイト。投稿は `posts/` フォルダにファイルを置き、`posts.json` に行を足すだけで反映される。

## ローカルで見る

このフォルダを丸ごとPCの好きな場所に置く。ターミナルでそのフォルダに移動して、

```
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開く。終わるときはターミナルで `Ctrl+C`。

## 投稿を追加する

1. 音源ファイル(`.mp3` / `.wav` など)を `posts/` フォルダに置く。
2. 画像があれば、同じく `posts/` に。
3. `posts.json` の配列の先頭に新しい投稿を書き足す。

```json
{
  "id": "005",
  "date": "2026-05-09",
  "author": "酒井",
  "text": "短い文章。省略可。",
  "image": "posts/image-05.jpg",
  "audio": "posts/sample-05.wav"
}
```

`text`、`image` は省略してよい。`audio` も無くてOK(その場合プレイヤーは表示されない)。並びは `date` で自動的に新→旧。

## ファイル構成

```
.
├── index.html       骨格(変える必要はほぼない)
├── style.css        見た目
├── script.js        動作(プレイヤー、投稿の読み込み)
├── posts.json       投稿のメタ情報
└── posts/           音源と画像
```

## 公開するとき

Netlify(https://www.netlify.com) のサイトを開いて、このフォルダを丸ごとブラウザにドラッグ&ドロップ。URLが発行される。
