export default () => ({
  database: {
    host: process.env.POSTGRES_HOST,
    port: 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  aws: {
    hostname: process.env.AWS_HOSTNAME || 'localhost:4566',
    maxFileSize: 5000000,
    protocol: process.env.AWS_PROTOCOL || 'http:',
    accessKeyId: process.env.ACCESS_KEY_ID, // aws access key id
    secretAccessKey: process.env.SECRET_ACCESS_KEY, // aws secret access key
    sqs: {
      name: process.env.SQS_QUEUE_NAME, // name of the queue
      queueUrl: `http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/${process.env.SQS_QUEUE_NAME}`,
    },
    s3: {
      fileBucket: {
        public: {
          name: process.env.AWS_S3_PUBLIC_BUCKET_NAME || 'publicbucket',
        },
      },
    },
    region: process.env.AWS_REGION || 'us-east-1',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: +process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  token: {
    value: process.env.FOOT_BALL_API_TOKEN,
    maxLimit: 6,
    rateWindow: process.env.API_RATE_WINDOW || 60000,
  },
  footballApi: {
    baseUrl: 'https://api.football-data.org/v4',
  },
});
