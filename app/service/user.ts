// Copyright 2019 - present Xlab
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

import { Service } from 'egg';
import { dataSource } from './datasource/decorators';

class UserService extends Service {

  @dataSource()
  async getModel() {
    return { message: 'No database connection' };
  }

  async getModelMongoose() {
    const mongoose = (this.app as any).mongoose;
    const Schema = mongoose.Schema;

    const UserSchema = new Schema({
      userName: { type: String },
      password: { type: String },
    });

    return mongoose.model('User', UserSchema);
  }

  @dataSource()
  async getUserByName(_userName: string) {
    return { message: 'No database connection' };
  }

  async getUserByNameMongoose(userName: string) {
    const model = await this.getModelMongoose();
    return model.findOne({ userName });
  }

}
module.exports = UserService;
