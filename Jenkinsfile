pipeline {
    agent any

    environment {
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

        stage('Build') {
            steps {
                sh "docker compose build"
            }
        }

        stage('Deploy Blue/Green') {
            steps {
                script {

                    def active = sh(
                        script: "grep server nginx.conf | grep -v '#' | awk '{print \$2}' | cut -d: -f1",
                        returnStdout: true
                    ).trim()

                    def target = (active == "blue") ? "green" : "blue"

                    echo "Active: ${active}"
                    echo "Deploying to: ${target}"

                    sh """
                    export APP_VERSION=${VERSION}

                    docker compose up -d --build ${target}

                    sleep 5
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    def status = sh(
                        script: "curl -s http://localhost:3000",
                        returnStatus: true
                    )

                    if (status != 0) {
                        error("Health check failed - aborting release")
                    }
                }
            }
        }

        stage('Switch Traffic') {
            steps {
                script {

                    def active = sh(
                        script: "grep server nginx.conf | grep -v '#' | awk '{print \$2}' | cut -d: -f1",
                        returnStdout: true
                    ).trim()

                    def target = (active == "blue") ? "green" : "blue"

                    sh """
                    sed -i 's/server ${active}:3000;/# server ${active}:3000;/' nginx.conf
                    sed -i 's/# server ${target}:3000;/server ${target}:3000;/' nginx.conf

                    docker compose exec nginx nginx -s reload
                    """
                }
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