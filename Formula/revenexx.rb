# Homebrew formula for the Revenexx CLI.
#
# TEMPLATE — not installable as-is. The `@@…@@` tokens are substituted with the
# release version and the real digests of the uploaded binaries by
# `scripts/publish-homebrew-formula.sh`, which then publishes the rendered
# formula to the tap repo `revenexx-sdks/homebrew-cli`:
#
#   brew install revenexx-sdks/cli/revenexx
#
# The formula installs the prebuilt single-file binary from the GitHub release —
# no Node.js or npm on the user's machine required.
class Revenexx < Formula
  # Homebrew style: no trailing period, and never lead with the formula name.
  desc "Command-line interface for the Revenexx platform"
  homepage "https://github.com/revenexx-sdks/cli"
  version "@@VERSION@@"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/revenexx-sdks/cli/releases/download/v#{version}/revenexx-darwin-arm64"
      sha256 "@@SHA256_DARWIN_ARM64@@"
    end

    on_intel do
      url "https://github.com/revenexx-sdks/cli/releases/download/v#{version}/revenexx-darwin-x64"
      sha256 "@@SHA256_DARWIN_X64@@"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/revenexx-sdks/cli/releases/download/v#{version}/revenexx-linux-arm64"
      sha256 "@@SHA256_LINUX_ARM64@@"
    end

    on_intel do
      url "https://github.com/revenexx-sdks/cli/releases/download/v#{version}/revenexx-linux-x64"
      sha256 "@@SHA256_LINUX_X64@@"
    end
  end

  def install
    # The release assets are bare, per-platform binaries, so the staged file
    # carries the asset name — rename it to the plain executable name.
    os = OS.mac? ? "darwin" : "linux"
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "revenexx-#{os}-#{arch}" => "revenexx"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/revenexx --version")
  end
end
