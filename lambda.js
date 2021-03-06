const AWS = require('aws-sdk');
const fileType = require('file-type');

const config = new AWS.Config({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.REGION
});

AWS.config.update(config);

const s3 = new AWS.S3({apiVersion: '2006-03-01'});

const imageTypes = [
    'image/gif',
    'image/jpeg',
    'image/png'
];

exports.handler = (event, context, callback) => {

    //get the image data from upload
    const body = JSON.parse(event.body);

    const fileBuffer = new Buffer(body['image'], 'base64');
    const fileTypeInfo = fileType(fileBuffer);

    //validate image is on right type
    if (fileBuffer.length < 500000 && imageTypes.includes(fileTypeInfo.mime)) {

        // upload it to s3 with unix timestamp as a file name
        const fileName = `${Math.floor(new Date() / 1000)}.${fileTypeInfo.ext}`;

        const bucket = process.env.BUCKET;
        const params = {
            Body: fileBuffer,
            Key: fileName,
            Bucket: bucket,
            ContentEncoding: 'base64',
            ContentType: fileTypeInfo.mime
        };

        s3.putObject(params, (err, data) => {
            if (err) callback(new Error([err.statusCode], [err.message]));

            callback(null, {
                statusCode: '200',
                headers: {'Access-Control-Allow-Origin': '*'},
                body: JSON.stringify({'data': data})
            });
        });


    } else {
        callback(null, {
            statusCode: '402',
            headers: {'Access-Control-Allow-Origin': '*'},
            body: JSON.stringify({"message": "Not a valid file type or file too big."})
        });
    }

};
