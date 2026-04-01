pipeline {
    agent any

    parameters {
        choice(
            name: 'HEALTH_MODE',
            choices: ['success', 'fail'],
            description: 'Simular estado del health check'
        )
    }

    environment {
        VERSION = ""
    }

    stages {

        stage('Verify nginx config') {
            steps {
                sh """
                echo "Checking nginx config..."
                ls -l nginx || (echo "nginx folder missing" && exit 1)
                ls -l nginx/nginx.conf || (echo "nginx.conf missing" && exit 1)
                """
            }
        }

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

        stage('Detect Active Environment') {
            steps {
                script {

                    def activeRaw = sh(
                        script: "grep -E 'server (blue|green):3000;' nginx/nginx.conf | grep -v '#' | sed -E 's/server (blue|green):3000;/\\1/'",
                        returnStdout: true
                    ).trim()

                    def active = activeRaw.replaceAll("[^a-zA-Z]", "")

                    if (active != "blue" && active != "green") {
                        error("Invalid active environment detected: '${activeRaw}'")
                    }

                    env.ACTIVE = active
                    env.TARGET = (active == "blue") ? "green" : "blue"

                    echo "Active: ${env.ACTIVE}"
                    echo "Target: ${env.TARGET}"
                }
            }
        }

        stage('Deploy Blue/Green') {
            steps {
                script {
                    echo "Deploying to: ${env.TARGET}"
                    echo "Health mode: ${params.HEALTH_MODE}"

                    sh """
                    export APP_VERSION=${VERSION}
                    export HEALTH_MODE=${params.HEALTH_MODE}

                    docker compose up -d --build nginx ${env.TARGET}
                    """

                    sleep 5
                }
            }
        }

        stage('Health Check PRO') {
            steps {
                script {

                    echo "Running health check on ${env.TARGET}"

                    try {
                        retry(5) {
                            sleep 3
                            sh "docker compose exec ${env.TARGET} curl -f localhost:3000/health"
                        }
                    } catch (Exception e) {
                        error("Health check failed - aborting release")
                    }
                }
            }
        }

        stage('Switch Traffic') {
            steps {
                script {

                    echo "Switching traffic from ${env.ACTIVE} to ${env.TARGET}"

                    sh """
                    docker compose ps nginx | grep Up || docker compose up -d nginx

                    sed -i 's|server ${env.ACTIVE}:3000;|# server ${env.ACTIVE}:3000;|' nginx/nginx.conf
                    sed -i 's|# server ${env.TARGET}:3000;|server ${env.TARGET}:3000;|' nginx/nginx.conf

                    docker compose restart nginx
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

    post {
        failure {
            echo "❌ Deployment failed. No traffic switch applied."
        }
        success {
            echo "✅ Deployment successful. Traffic switched to ${env.TARGET}"
        }
    }
}