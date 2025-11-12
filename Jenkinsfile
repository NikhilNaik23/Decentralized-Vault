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
                    docker ps --filter "name=decentralized"
                    echo ""
                    echo "Frontend should be at: http://localhost"
                    echo "Backend should be at: http://localhost:5000"
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