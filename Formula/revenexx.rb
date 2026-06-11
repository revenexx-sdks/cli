require "language/node"

class RevenexxAPIRevenexx < Formula
  desc "CLI is a Node based command-line tool for RevenexxAPIRevenexx API"
  homepage "https://revenexx.com"
  license "MIT"
  head "https://github.com/revenexx/cli.git", branch: "master"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    system "true"
  end
end