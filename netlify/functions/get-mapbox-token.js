exports.handler = async () => {
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: process.env.MAPBOX_ACCESS_TOKEN
        })
    };
};
