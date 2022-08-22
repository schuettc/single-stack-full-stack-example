const config = await fetch('./config.json').then((response) => response.json());

export const AmplifyConfig = {
    API: {
        endpoints: [
            {
                name: 'exampleApi',
                endpoint: config.apiUrl,
            },
        ],
    },
};
