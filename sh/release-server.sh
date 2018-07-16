#!/bin/bash
#-----------------------------------------------------------------------------
# Copyright (C) 2018 Christian Jean.
# All Rights Reserved.
#-----------------------------------------------------------------------------
# Script to build/release the Node.js server (normal and minimized).
#-----------------------------------------------------------------------------
#

BASE="jeach-components"
REPO="releases"

echo
echo "Releasing '$BASE-server' version $VERSION"
echo

echo " >> Packaged: $BASE-client-$VERSION.min.js"
cp client/$BASE-client.js $REPO/$BASE-client-$VERSION.js

[ ! -x "bin/jsmin" ] && sh/jsmin.sh
[ ! -x "bin/jsmin" ] && echo "Could not find 'JSMin' executable, aborting!" && exit 1

echo " >> Packaged: $BASE-client-$VERSION.min.js"
bin/jsmin < client/$BASE-client.js > $REPO/$BASE-client-$VERSION.min.js
