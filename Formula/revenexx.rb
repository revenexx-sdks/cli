require "language/node"

class Revenexx < Formula
  desc "Node-based command-line tool for the Revenexx API"
  homepage "https://revenexx.com"
  license "MIT"
  head "https://github.com/revenexx-sdks/cli.git", branch: "master"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    system "true"
  end
end