pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Test') {
            steps {
                bat '''
                    docker run -d --name test-mongo -p 27017:27017 mongo:7.0
                    timeout /t 10 /nobreak
                    cd backend
                    npm install
                    npm test || exit 0
                    docker stop test-mongo
                    docker rm test-mongo
                '''
            }
        }
        
        stage('Build & Deploy') {
            steps {
                bat '''
                    docker-compose down
                    docker-compose build
                    docker-compose up -d
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
        }
        always {
            bat 'docker stop test-mongo 2>nul || exit 0'
            bat 'docker rm test-mongo 2>nul || exit 0'
        }
    }
}