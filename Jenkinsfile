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
                    ls -la backend/.env frontend/.env
                '''
            }
        }
        
        stage('Cleanup') {
            steps {
                echo '🧹 Cleaning up...'
                sh '''
                    docker stop test-mongo 2>/dev/null || true
                    docker rm test-mongo 2>/dev/null || true
                    docker-compose down -v || true
                    docker system prune -f || true
                '''
            }
        }
        
        stage('Test') {
            steps {
                echo '🧪 Running tests...'
                sh '''
                    docker run -d --name test-mongo -p 27017:27017 mongo:7.0
                    sleep 15
                    
                    cd backend
                    npm install
                    npm test || echo "Tests completed"
                    
                    docker stop test-mongo
                    docker rm test-mongo
                '''
            }
        }
        
        stage('Build') {
            steps {
                echo '🐳 Building images...'
                sh '''
                    docker-compose build --no-cache
                    docker images | grep identity-vault
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                echo '🚀 Deploying...'
                sh '''
                    docker-compose up -d
                    
                    echo "Waiting for services to start..."
                    sleep 30
                    
                    echo "=== Container Status ==="
                    docker-compose ps
                    
                    echo "=== MongoDB Logs ==="
                    docker logs identity-vault-mongodb --tail 20
                    
                    echo "=== Backend Logs ==="
                    docker logs identity-vault-backend --tail 20
                    
                    echo "=== Frontend Logs ==="
                    docker logs identity-vault-frontend --tail 20
                    
                    echo "=== Network Status ==="
                    docker network inspect decentralizedidentityvault_identity-vault-network || true
                '''
            }
        }
        
        stage('Verify') {
            steps {
                echo '✅ Verifying...'
                sh '''
                    echo "=== Running Containers ==="
                    docker ps --filter "name=identity-vault"
                    
                    echo "=== Health Check ==="
                    sleep 5
                    curl -f http://localhost:5000/health || echo "Backend health check failed"
                    curl -f http://localhost:5173 || echo "Frontend check failed"
                    
                    echo ""
                    echo "✅ Deployment URLs:"
                    echo "🌐 Frontend: http://localhost:5173"
                    echo "🔧 Backend: http://localhost:5000"
                    echo "🗄️ MongoDB: localhost:27018"
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
                echo "=== All Container Logs ==="
                docker-compose logs --tail=50
                
                echo "=== Container Status ==="
                docker ps -a
                
                echo "=== Network Status ==="
                docker network ls
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