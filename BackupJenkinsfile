pipeline {
    agent any

    environment {
        IMAGE_NAME = "devops-lab-app"
        VERSION = ""
    }

    stages {

        stage('Generate Version') {
            steps {
                script {
                    VERSION = sh(
                        script: "date +%Y.%m.%d.%H%M",
                        returnStdout: true
                    ).trim()
                    env.APP_VERSION = VERSION
                }
            }
        }

        stage('Build Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${VERSION} ."
            }
        }

        stage('Deploy') {
            steps {
                sh """
                export APP_VERSION=${VERSION}
                docker compose down
                docker compose up -d --build
                """
            }
        }

        stage('Tag Release') {
            steps {
                sh """
                git config user.email "jenkins@local"
                git config user.name "jenkins"

                git tag v${VERSION}
                git push origin v${VERSION}
                """
            }
        }
    }
}