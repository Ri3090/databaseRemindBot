# databaseRemind.js

## はじめに
ローカル環境での動作を前提としているため、mysql、nord.jsのインストールが必要です。
AWSを使用した常時稼働を検討中です。

```
npm install
npm install mysql
npm install discord.js
```

を実行して、モジュールをインストールする。

.env.sampleを参考にして.envを作成し、トークンを登録する。

```
node register.js
```

をして、コマンドを登録する。


## 稼働コマンド

```
npm run start
```

でbotを起動する。
