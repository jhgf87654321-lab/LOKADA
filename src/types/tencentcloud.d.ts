declare module "tencentcloud" {
  export const asr: {
    v20190614: {
      Client: new (config: any) => {
        CreateRecTask(params: any): Promise<any>;
        DescribeTaskStatus(params: any): Promise<any>;
      };
    };
  };
}
