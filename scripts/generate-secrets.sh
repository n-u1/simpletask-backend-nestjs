#!/bin/bash

# 本番環境用の安全な秘密鍵生成スクリプト

echo "🔑 本番環境用の秘密鍵を生成します..."

echo ""
echo "JWT_SECRET_KEY用のランダム文字列（64文字）:"
node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"

echo ""
echo "データベースパスワード用のランダム文字列（32文字）:"
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

echo ""
echo "Redisパスワード用のランダム文字列（32文字）:"
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

echo ""
echo "Argon2 Salt用のランダム文字列（16文字）:"
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

echo ""
echo "⚠️  これらの値を安全な場所に保存し、.envファイルに設定してください"
echo "⚠️  秘密鍵は絶対にGitにコミットしないでください"
