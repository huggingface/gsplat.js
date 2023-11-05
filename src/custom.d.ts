declare module "web-worker:*" {
    const WorkerConstructor: {
        new (): Worker;
    };
    export default WorkerConstructor;
}
