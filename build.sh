#!/bin/bash
echo "Building Parallax Backend..."
cd backend/backend || exit 1
mvn clean compile
if [ $? -ne 0 ]; then
    echo ""
    echo "Backend build failed!"
    exit 1
fi
echo ""
echo "Backend build successful!"
exit 0
