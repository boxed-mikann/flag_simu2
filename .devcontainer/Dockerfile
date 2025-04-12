FROM node:18

# 作業ディレクトリを設定
WORKDIR /workspaces/flag_simu

# 環境変数を設定
ENV NODE_ENV=development

# 必要なシステムパッケージをインストール
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install git curl wget \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# yarnは既にNode.jsイメージにインストールされているので削除

# ユーザーは既に作成済み (nodeユーザー)

# デフォルトシェルをbashに設定
SHELL ["/bin/bash", "-c"]

# コンテナ起動時にアプリケーションを実行
CMD ["bash"]