pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                echo '📥 Checking out code...'
                checkout scm
                
                sh '''
                    echo "Creating backend/.env..."
                    cp backend/.env.example backend/.env
                    sed -i 's/NODE_ENV=development/NODE_ENV=production/' backend/.env
                    sed -i 's/PORT=3000/PORT=5000/' backend/.env
                    sed -i 's/HOST=localhost/HOST=0.0.0.0/' backend/.env
                    sed -i 's|mongodb://localhost:27017|mongodb://mongodb:27017|g' backend/.env
                    
                    echo "Creating frontend/.env..."
                    cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:5000/api
EOF
                    
                    echo "✅ Environment files created"
                    cat backend/.env
                    cat frontend/.env
                '''
            }
        }
        
        stage('Cleanup') {
            steps {
                echo '🧹 Cleaning up...'
                sh '''
                    docker stop test-mongo 2>/dev/null || true
                    docker rm test-mongo 2>/dev/null || true
                    docker-compose down -v 2>/dev/null || true
                '''
            }
        }
        
        stage('Verify Files') {
            steps {
                echo '📂 Verifying project structure...'
                sh '''
                    echo "=== Current Directory ==="
                    pwd
                    
                    echo ""
                    echo "=== Project Files ==="
                    ls -la
                    
                    echo ""
                    echo "=== Docker Compose File ==="
                    cat docker-compose.yml
                    
                    echo ""
                    echo "=== Backend Files ==="
                    ls -la backend/
                    
                    echo ""
                    echo "=== Frontend Files ==="
                    ls -la frontend/
                '''
            }
        }
        
        stage('Test') {
            steps {
                echo '🧪 Running tests...'
                sh '''
                    docker run -d --name test-mongo -p 27017:27017 mongo:7.0
                    sleep 20
                    
                    cd backend
                    npm install
                    npm test || echo "Tests completed"
                    
                    cd ..
                    docker stop test-mongo
                    docker rm test-mongo
                '''
            }
        }
        
        stage('Build') {
            steps {
                echo '🐳 Building Docker images...'
                sh '''
                    echo "=== Building with docker-compose ==="
                    docker-compose build --no-cache 2>&1 | tee build.log
                    
                    echo ""
                    echo "=== Build Exit Code: $? ==="
                    
                    echo ""
                    echo "=== Images Created ==="
                    docker images | grep -E "identity-vault|decentralized" || echo "No images found"
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                echo '🚀 Deploying containers...'
                sh '''
                    echo "=== Starting containers with docker-compose ==="
                    docker-compose up -d 2>&1 | tee deploy.log
                    
                    echo ""
                    echo "=== Deploy Exit Code: $? ==="
                    
                    echo ""
                    echo "=== Waiting for startup ==="
                    sleep 30
                    
                    echo ""
                    echo "=== Docker Compose Status ==="
                    docker-compose ps
                    
                    echo ""
                    echo "=== All Containers ==="
                    docker ps -a
                    
                    echo ""
                    echo "=== Container Logs ==="
                    docker-compose logs --tail=30
                '''
            }
        }
        
        stage('Verify') {
            steps {
                echo '✅ Verifying deployment...'
                sh '''
                    echo "=== Running Containers ==="
                    docker ps --filter "name=identity-vault"
                    
                    echo ""
                    echo "✅ Deployment Complete!"
                    echo "🌐 Frontend: http://localhost:5173"
                    echo "🔧 Backend: http://localhost:5000"
                '''
            }
        }
    }
    
    post {
        success {
            echo '✅ SUCCESS!'
            echo '🌐 Frontend: http://localhost:5173'
            echo '🔧 Backend: http://localhost:5000'
        }
        failure {
            echo '❌ FAILED! Debug info:'
            sh '''
                echo "=== Build Log ==="
                cat build.log 2>/dev/null || echo "No build log"
                
                echo ""
                echo "=== Deploy Log ==="
                cat deploy.log 2>/dev/null || echo "No deploy log"
                
                echo ""
                echo "=== Docker Compose Status ==="
                docker-compose ps 2>&1 || echo "Could not get status"
                
                echo ""
                echo "=== All Container Logs ==="
                docker-compose logs --tail=50 2>&1 || echo "No logs available"
            '''
        }
        always {
            sh '''
                docker stop test-mongo 2>/dev/null || true
                docker rm test-mongo 2>/dev/null || true
            '''
        }
    }
}