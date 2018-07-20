#!/bin/bash
#-----------------------------------------------------------------------------
# Copyright (C) 2018 Christian Jean.
# All Rights Reserved.
#-----------------------------------------------------------------------------
# Script to build/release the Node.js server (normal and minimized).
#-----------------------------------------------------------------------------
#

#npm version major|minor|patch
#git tag v

BASE="server"
NAME="jeach-pqueues"
REPO="releases"


[ ! -d $BASE ] && echo "Could not find '$BASE' directory, aborting!" && exit 1

cd $BASE &> /dev/null
CUR_VER=v$(cat package.json | grep version | cut -d: -f2 | sed 's/[ ",]//g')

case "$1" in
  pat|Pat|PAT|patch|Patch|PATCH) TARGET="patch" ;;
  min|Min|MIN|minor|Minor|MINOR) TARGET="minor" ;;
  maj|Maj|MAJ|major|Major|MAJOR) TARGET="major" ;;
  *) TARGET="patch" ;;
esac

NEX_VER=$(npm version $TARGET)

echo
echo "Releasing '$NAME'..."
echo
echo " >> Release type     : $TARGET"
echo " >> Current version  : $CUR_VER"
echo " >> Next version     : $NEX_VER"

#PACK=$(npm pack)
#echo " >> Released package : $PACK"
#mv $PACK ../$REPO/$PACK

git add -f ../releases/$PACK
git add package.json
git commit -m "Releasing $NAME $NEX_VER" &> /dev/null

echo " >> Tagging"
git tag $NEX_VER

echo
echo "Pushing to GitHub..."
echo
git push &> /dev/null
git push --tags &> /dev/null
SHA=$(git show $NEX_VER | head -n 1 | sed 's/commit //g') 
echo " >> Commit $SHA"

echo
echo "Pushing to NPM JS..."
echo
npm publish

echo " >> Successfully completed releas"
