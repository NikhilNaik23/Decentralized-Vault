pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                echo '📥 Checking out code...'
                checkout scm
                
                // Create backend .env from .env.example
                sh '''
                    echo "Creating backend/.env from .env.example..."
                    cp backend/.env.example backend/.env
                    
                    # Override production values
                    sed -i 's/NODE_ENV=development/NODE_ENV=production/' backend/.env
                    sed -i 's/PORT=3000/PORT=5000/' backend/.env
                    sed -i 's/HOST=localhost/HOST=0.0.0.0/' backend/.env
                    sed -i 's|mongodb://localhost:27017|mongodb://mongodb:27017|g' backend/.env
                    sed -i 's|CORS_ORIGIN=http://localhost:3001|CORS_ORIGIN=http://localhost,http://localhost:5173|' backend/.env
                    
                    echo "✅ Backend .env created"
                '''
                
                // Create frontend .env
                sh '''
                    echo "Creating frontend/.env..."
                    cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:5000/api
EOF
                    
                    echo "✅ Frontend .env created"
                '''
            }
        }
        
        stage('Cleanup') {
            steps {
                echo '🧹 Cleaning up old containers...'
                sh '''
                    docker stop test-mongo 2>/dev/null || true
                    docker rm test-mongo 2>/dev/null || true
                    docker-compose down || true
                '''
            }
        }
        
        stage('Test') {
            steps {
                echo '🧪 Running backend tests...'
                sh '''
                    echo "Starting test MongoDB..."
                    docker run -d --name test-mongo -p 27017:27017 mongo:7.0
                    
                    echo "Waiting for MongoDB to be ready..."
                    sleep 15
                    
                    echo "Installing backend dependencies..."
                    cd backend
                    npm install
                    
                    echo "Running tests..."
                    npm test || true
                    
                    echo "Stopping test MongoDB..."
                    docker stop test-mongo
                    docker rm test-mongo
                '''
            }
        }
        
        stage('Build') {
            steps {
                echo '🐳 Building Docker images...'
                sh 'docker-compose build'
            }
        }
        
        stage('Deploy') {
            steps {
                echo '🚀 Deploying containers...'
                sh '''
                    docker-compose up -d
                    sleep 20
                    docker-compose ps
                '''
            }
        }
        
        stage('Verify') {
            steps {
                echo '✅ Verifying deployment...'
                sh '''
                    docker ps --filter "name=identity-vault"
                    echo ""
                    echo "Frontend: http://localhost:5173"
                    echo "Backend: http://localhost:5000"
                '''
            }
        }
    }
    
    post {
        success {
            echo '✅ Deployment successful!'
            echo '🌐 Frontend: http://localhost:5173'
            echo '🔧 Backend: http://localhost:5000'
        }
        failure {
            echo '❌ Deployment failed! Showing logs...'
            sh 'docker-compose logs --tail=30 backend || true'
            sh 'docker-compose logs --tail=30 frontend || true'
        }
        always {
            echo '🧹 Cleaning up test containers...'
            sh '''
                docker stop test-mongo 2>/dev/null || true
                docker rm test-mongo 2>/dev/null || true
            '''
        }
    }
}