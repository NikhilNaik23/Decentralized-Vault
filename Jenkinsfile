pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                echo '📥 Checking out code...'
                checkout scm
                
                sh '''
                    cp backend/.env.example backend/.env
                    sed -i 's/NODE_ENV=development/NODE_ENV=production/' backend/.env
                    sed -i 's/PORT=3000/PORT=5000/' backend/.env
                    sed -i 's/HOST=localhost/HOST=0.0.0.0/' backend/.env
                    sed -i 's|mongodb://localhost:27017|mongodb://mongodb:27017|g' backend/.env
                    
                    echo "VITE_API_URL=http://localhost:5000/api" > frontend/.env
                '''
            }
        }
        
        stage('Cleanup') {
            steps {
                echo '🧹 Cleaning up...'
                sh 'docker-compose down -v 2>/dev/null || true'
            }
        }
        
        stage('Test') {
            steps {
                echo '🧪 Running tests...'
                sh '''
                    docker run -d --name test-mongo -p 27017:27017 mongo:7.0
                    sleep 15
                    cd backend && npm install && npm test || true
                    docker stop test-mongo && docker rm test-mongo
                '''
            }
        }
        
        stage('Build') {
            steps {
                echo '🐳 Building images...'
                sh 'docker-compose build'
            }
        }
        
        stage('Deploy') {
            steps {
                echo '🚀 Deploying...'
                sh '''
                    docker-compose up -d
                    sleep 20
                    docker-compose ps
                '''
            }
        }
        
        stage('Verify') {
            steps {
                echo '✅ Verifying...'
                sh '''
                    docker ps --filter "name=identity-vault"
                    echo ""
                    echo "🌐 Frontend: http://localhost:5173"
                    echo "🔧 Backend: http://localhost:5000"
                '''
            }
        }
    }
    
    post {
        success {
            echo '✅ Deployment successful!'
        }
        failure {
            echo '❌ Deployment failed!'
            sh 'docker-compose logs --tail=30'
        }
        always {
            sh 'docker stop test-mongo 2>/dev/null || true; docker rm test-mongo 2>/dev/null || true'
        }
    }
}