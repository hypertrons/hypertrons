// Copyright 2019 Xlab
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { app } from 'egg-mock/bootstrap';
import { InstallationType } from '../../app/plugin/installation-manager/types';

describe('Installation Controller', () => {
  describe('GET /installation/:installationName', () => {
    it('should status 200 and get the body', () => {
      app.installation.getInstallationInfoByName = (iName: string): { id: number, type: InstallationType } => {
        return { id: 0, type: iName as any };
      };
      app.github.getConfigType = (): any => {
        return { foo: 'bar' };
      };
      return app.httpRequest()
        .get('/installation/github')
        .expect(200)
        .expect({ foo: 'bar' });
    });

    it('should status 200 and get the body', () => {
      app.installation.getInstallationInfoByName = (iName: string): { id: number, type: InstallationType } => {
        return { id: 0, type: iName as any };
      };
      app.gitlab.getConfigType = (): any => {
        return { foo: 'bar' };
      };
      return app.httpRequest()
        .get('/installation/gitlab')
        .expect(200)
        .expect({ foo: 'bar' });
    });

    it('should status 200 and get {}', () => {
      app.installation.getInstallationInfoByName = (iName: string): { id: number, type: InstallationType } => {
        return { id: 0, type: iName as any };
      };
      return app.httpRequest()
        .get('/installation/not_exist')
        .expect(200)
        .expect({});
    });

    // it('should send multi requests', async () => {
    //   // 使用 generator function 方式写测试用例，可以在一个用例中串行发起多次请求
    //   await app.httpRequest()
    //     .get('/')
    //     .expect(200) // 期望返回 status 200
    //     .expect('hello world'); // 期望 body 是 hello world

    //   // 再请求一次
    //   const result = await app.httpRequest()
    //     .get('/')
    //     .expect(200)
    //     .expect('hello world');

    //   // 也可以这样验证
    //   assert(result.status === 200);
    // });
  });
});
