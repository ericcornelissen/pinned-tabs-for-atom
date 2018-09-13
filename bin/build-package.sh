#!/bin/sh

ATOM_CHANNEL="${ATOM_CHANNEL:=stable}"

echo "Downloading latest Atom release on the ${ATOM_CHANNEL} channel..."
if [ "${TRAVIS_OS_NAME}" = "osx" ]; then
  curl -s -L "https://atom.io/download/mac?channel=${ATOM_CHANNEL}" \
    -H 'Accept: application/octet-stream' \
    -o "atom.zip"
  mkdir atom
  unzip -q atom.zip -d atom

  # Set variables to Atom executables
  if [ "${ATOM_CHANNEL}" = "stable" ]; then
    export ATOM_APP_NAME="Atom.app"
    export ATOM_SCRIPT_NAME="atom.sh"
    export ATOM_SCRIPT_PATH="./atom/${ATOM_APP_NAME}/Contents/Resources/app/atom.sh"
  else
    export ATOM_APP_NAME="Atom ${ATOM_CHANNEL}.app"
    export ATOM_SCRIPT_NAME="atom-${ATOM_CHANNEL}"
    export ATOM_SCRIPT_PATH="./atom-${ATOM_CHANNEL}"
    ln -s "./atom/${ATOM_APP_NAME}/Contents/Resources/app/atom.sh" "${ATOM_SCRIPT_PATH}"
  fi
  export APM_SCRIPT_PATH="./atom/${ATOM_APP_NAME}/Contents/Resources/app/apm/node_modules/.bin/apm"

  # Add `atom.sh` to PATH
  export PATH="${PATH}:${TRAVIS_BUILD_DIR}/atom/${ATOM_APP_NAME}/Contents/Resources/app"
elif [ "${TRAVIS_OS_NAME}" = "linux" ]; then
  curl -s -L "https://atom.io/download/deb?channel=${ATOM_CHANNEL}" \
    -H 'Accept: application/octet-stream' \
    -o "atom-amd64.deb"
  /sbin/start-stop-daemon --start --quiet --pidfile /tmp/custom_xvfb_99.pid --make-pidfile --background --exec /usr/bin/Xvfb -- :99 -ac -screen 0 1280x1024x16
  export DISPLAY=":99"
  dpkg-deb -x atom-amd64.deb "${HOME}/atom"

  # Set variables to Atom executables
  if [ "${ATOM_CHANNEL}" = "stable" ]; then
    export ATOM_SCRIPT_NAME="atom"
    export APM_SCRIPT_NAME="apm"
  else
    export ATOM_SCRIPT_NAME="atom-${ATOM_CHANNEL}"
    export APM_SCRIPT_NAME="apm-${ATOM_CHANNEL}"
  fi
  export ATOM_SCRIPT_PATH="${HOME}/atom/usr/bin/${ATOM_SCRIPT_NAME}"
  export APM_SCRIPT_PATH="${HOME}/atom/usr/bin/${APM_SCRIPT_NAME}"

  # Add `atom` to PATH
  export PATH="$PATH:${HOME}/atom/usr/bin"
fi

echo "Using Atom version:"
"${ATOM_SCRIPT_PATH}" -v
echo "Using APM version:"
"${APM_SCRIPT_PATH}" -v

echo "Downloading package dependencies..."
"${APM_SCRIPT_PATH}" clean
"${APM_SCRIPT_PATH}" install --production

# Use the system NPM to install the devDependencies
echo "Using Node version:"
node --version
echo "Using NPM version:"
npm --version
echo "Installing remaining dependencies..."
npm install
