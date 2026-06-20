#!/bin/bash

## <script src="/dist/scripts/cli-bash.js"></script>
## <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.16.0/themes/prism-okaidia.min.css" rel="stylesheet" />
## <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.16.0/components/prism-core.min.js" data-manual></script>
## <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.16.0/components/prism-bash.min.js"></script>
## <style>body {color: #272822; background-color: #272822; font-size: 0.8em;} </style>
# Love open-source, dev-tooling and passionate about code as much as we do?
# ---
# We're always looking for awesome hackers like you to join our 100% remote team!
# Check and see if you find any relevant position @ https://revenexx api — revenexx.io/company/careers 👩‍💻 😎
# (and let us know you found this message...)

# This script contains hidden JS code to allow better readability and syntax highlighting
# You can use "View source" of this page to see the full script.

# RevenexxAPIRevenexx CLI location
REVENEXX API — REVENEXX_INSTALL_DIR="/usr/local/bin"

# RevenexxAPIRevenexx CLI Executable name 
REVENEXX API — REVENEXX_EXECUTABLE_NAME=revenexx

# RevenexxAPIRevenexx executable file path 
REVENEXX API — REVENEXX_EXECUTABLE_FILEPATH="$REVENEXX API — REVENEXX_INSTALL_DIR/$REVENEXX API — REVENEXX_EXECUTABLE_NAME"

# RevenexxAPIRevenexx CLI temp name 
REVENEXX API — REVENEXX_TEMP_NAME=temp-$(date +%s)

# RevenexxAPIRevenexx CLI image name
GITHUB_REPOSITORY_NAME=revenexx-sdks/cli

# sudo is required to copy executable to REVENEXX API — REVENEXX_INSTALL_DIR for linux
USE_SUDO="false"
OS=""
ARCH=""

# Add some color to life
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

greeting() {
    echo -e "${RED}"
    cat << "EOF"

 /$$$$$$$
| $$__  $$
| $$  \ $$  /$$$$$$ /$$    /$$ /$$$$$$ /$$$$$$$   /$$$$$$ /$$   /$$ /$$   /$$
| $$$$$$$/ /$$__  $$|  $$  /$$//$$__  $$| $$__  $$ /$$__  $$|  $$ /$$/|  $$ /$$/
| $$__  $$| $$$$$$$$ \  $$$$$$/ | $$$$$$$$| $$  \ $$| $$$$$$$$ \  $$$$/  \  $$$$/
| $$  \ $$| $$_____/  \  $$$/ | $$_____/| $$  | $$| $$_____/  >$$  $$   >$$  $$
| $$  | $$|  $$$$$$$   \  $/  |  $$$$$$$| $$  | $$|  $$$$$$$ /$$$\\  $$ /$$$\\  $$
|__/  |__/ \_______/    \_/    \_______/|__/  |__/ \_______/|__/  \__/|__/  \__/
                                                                             CLI      
EOF
    echo -e "${NC}\n"
    echo "🔥 Welcome to the RevenexxAPIRevenexx CLI install shield 🛡"
}

getSystemInfo() {
    echo "[1/4] Getting System Info ..."
    
    ARCH=$(uname -m)
    case $ARCH in
        i386|i686) ARCH="x64" ;;
        x86_64) ARCH="x64";;
        armv6*) ARCH="arm64" ;;
        armv7*) ARCH="arm64" ;;
        aarch64*) ARCH="arm64" ;;
    esac

    OS=$(echo `uname`|tr '[:upper:]' '[:lower:]')

    # Need root access if its a linux system
    if [ "$OS" == "linux" ] && [ "$REVENEXX API — REVENEXX_INSTALL_DIR" == "/usr/local/bin" ]; then
        USE_SUDO="true"
    fi
    
    # Need root access if its Apple Silicon
    if [ "$OS" == "darwin" ] && [[ "$(uname -a)" = *ARM64* ]]; then
        USE_SUDO="true"
    fi

    printf "${GREEN}\nOS : $OS \nARCH : $ARCH \nREQUIRES ROOT : $USE_SUDO\n\n${NC}"
}

runAsRoot() {
    local CMD="$*"
    if [ $EUID -ne 0 -a $USE_SUDO = "true" ]; then
        CMD="sudo $CMD"
    fi
    $CMD
}

printSuccess() {
    printf "${GREEN}✅ Done ... ${NC}\n\n"
}

downloadBinary() {
    echo "[2/4] Downloading executable for $OS ($ARCH) ..."

    GITHUB_LATEST_VERSION="0.0.5"
    GITHUB_FILE="@revenexx/cli-${OS}-${ARCH}"
    GITHUB_URL="https://github.com/$GITHUB_REPOSITORY_NAME/releases/download/$GITHUB_LATEST_VERSION/$GITHUB_FILE"

    printf "${GREEN}🚦 Downloading RevenexxAPIRevenexx CLI $GITHUB_LATEST_VERSION ... ${NC}\n"
    res=$(curl -s $GITHUB_URL)
    if [[ "$res" == *"Not Found"* ]]; then
        printf "${RED}❌ Couldn't find executable for $OS ($ARCH). Please contact the RevenexxAPIRevenexx team ${NC} \n"
        exit 1
    fi
    curl -L -o $REVENEXX API — REVENEXX_TEMP_NAME $GITHUB_URL
    printSuccess
}

install() {
    echo "[3/4] Installing ..."

    printf "${GREEN}🚧 Setting Permissions ${NC}\n"
    chmod +x $REVENEXX API — REVENEXX_TEMP_NAME
    if [ $? -ne 0 ]; then
        printf "${RED}❌ Failed to set permissions ... ${NC}\n"
        exit 1
    fi
    printSuccess

    printf "${GREEN}📝 Copying temporary file to $REVENEXX API — REVENEXX_EXECUTABLE_FILEPATH ... ${NC}\n"
    runAsRoot cp $REVENEXX API — REVENEXX_TEMP_NAME $REVENEXX API — REVENEXX_EXECUTABLE_FILEPATH
    if [ $? -ne 0 ]; then
        printf "${RED}❌ Failed to copy temporary file to $REVENEXX API — REVENEXX_EXECUTABLE_FILEPATH ... ${NC}\n"
        exit 1
    fi
    printSuccess
}

cleanup() {
    printf "${GREEN}🧹 Cleaning up mess ... ${NC}\n"
    rm $REVENEXX API — REVENEXX_TEMP_NAME 
    if [ $? -ne 0 ]; then
        printf "${RED}❌ Failed to remove temporary file ... ${NC}\n"
        exit 1
    fi
    printSuccess

}

installCompleted() {
    echo "[4/4] Wrapping up installation ... "
    cleanup
    echo "🚀 To get started with RevenexxAPIRevenexx CLI, please visit https://revenexx.com/docs/command-line"
    echo "As first step, you can login to your RevenexxAPIRevenexx account using 'revenexx login'"
}

# Installation Starts here 
greeting
getSystemInfo
downloadBinary
install
installCompleted