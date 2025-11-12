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
                sh '''
                    docker run -d --name test-mongo -p 27017:27017 mongo:7.0
                    sleep 10
                    cd backend
                    npm install
                    npm test || true
                    docker stop test-mongo
                    docker rm test-mongo
                '''
            }
        }
        
        stage('Build & Deploy') {
            steps {
                sh '''
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
            sh 'docker stop test-mongo 2>/dev/null || true'
            sh 'docker rm test-mongo 2>/dev/null || true'
        }
    }
}
