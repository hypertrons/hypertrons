pipeline {
    agent {
        docker {
            image 'node:10'
            args '-v /data:/data:ro -u root'
        }
    }
    options {
        timeout(time: 30, unit: 'MINUTES') 
    }
    stages {
        stage('Install') {
            steps{
                sh 'npm config set registry=https://registry.npm.taobao.org'
                sh 'npm install'
                sh 'npm install typescript@latest -g'
            }
        }
        stage('Test') {
            steps {
                sh 'npm run test'
            }
        }
        stage('Deploy') {
            steps {
                sh 'printenv'
            }
        }
    }
    post {
        always {
            script {
                def buildResult = "${currentBuild.currentResult}".toLowerCase()
                
                def myColor = "danger"
                if (buildResult == "success") {
                    myColor = "good"
                }

                def commitId = "${env.GIT_COMMIT}".substring(0, 7)

                def attachments = [
                    [
                        text: """
                        Project `${env.JOB_NAME}` ${buildResult} build (<${env.BUILD_URL}|#${currentBuild.number}>) for commit (<${env.GIT_URL}|${commitId}>) on branch `${env.BRANCH_NAME}`\nExecution time: ${currentBuild.durationString}\nMessage: The build ${buildResult}.
                        """,
                        fallback: "Jenkins pipeline ${buildResult}",
                        color: myColor
                    ]
                ]
                slackSend(channel: '#cicd', attachments: attachments)
            }
        }
    }
}
