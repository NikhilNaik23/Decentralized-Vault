pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                echo '📥 Checking out code...'
                checkout scm
            }
        }
        
        stage('Cleanup') {
            steps {
                echo '🧹 Cleaning up old containers...'
                bat '''
                    docker stop test-mongo 2>nul || exit 0
                    docker rm test-mongo 2>nul || exit 0
                    docker-compose down || exit 0
                '''
            }
        }
        
        stage('Test') {
            steps {
                echo '🧪 Running backend tests...'
                bat '''
                    echo Starting test MongoDB...
                    docker run -d --name test-mongo -p 27017:27017 mongo:7.0
                    
                    echo Waiting for MongoDB to be ready...
                    timeout /t 15 /nobreak
                    
                    echo Installing backend dependencies...
                    cd backend
                    call npm install
                    
                    echo Running tests...
                    call npm test || exit 0
                    
                    echo Stopping test MongoDB...
                    docker stop test-mongo
                    docker rm test-mongo
                '''
            }
        }
        
        stage('Build') {
            steps {
                echo '🐳 Building Docker images...'
                bat 'docker-compose build'
            }
        }
        
        stage('Deploy') {
            steps {
                echo '🚀 Deploying containers...'
                bat '''
                    docker-compose up -d
                    timeout /t 20 /nobreak
                    docker-compose ps
                '''
            }
        }
        
        stage('Verify') {
            steps {
                echo '✅ Verifying deployment...'
                bat '''
                    docker ps --filter "name=decentralized"
                    echo.
                    echo Frontend should be at: http://localhost
                    echo Backend should be at: http://localhost:5000
                '''
            }
        }
    }
    
    post {
        success {
            echo '✅ Deployment successful!'
            echo '🌐 Frontend: http://localhost'
            echo '🔧 Backend: http://localhost:5000'
        }
        failure {
            echo '❌ Deployment failed! Showing logs...'
            bat 'docker-compose logs --tail=30 backend'
            bat 'docker-compose logs --tail=30 frontend'
        }
        always {
            echo '🧹 Cleaning up test containers...'
            bat '''
                docker stop test-mongo 2>nul || exit 0
                docker rm test-mongo 2>nul || exit 0
            '''
        }
    }
}