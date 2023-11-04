declare module "web-worker:*" {
    const workerConstructor: {
        new (): Worker;
    };
    export default workerConstructor;
}
