export function getRequestParam(request, delimiter) {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(segment => segment !== ''); // ['s', 'someValue']

    if (pathSegments.length === 2 && pathSegments[0].toLowerCase() === delimiter) {
        const shortId = pathSegments[1];
        return shortId;
    }
    return null; // Return null if the path does not match the expected format
}