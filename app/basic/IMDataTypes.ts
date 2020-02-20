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

export interface DingTalkText {
  msgtype: 'text';
  text: {
    content: string;
  };
  at?: {
    atMobiles: string[];
    isAtAll: boolean;
  };
}

export interface DingTalkLink {
  msgtype: 'link';
  link: {
    text: string;
    title: string;
    picUrl: string;
    messageUrl: string;
  };
}

export interface DingTalkMarkdown {
  msgtype: 'markdown';
  markdown: {
    title: string;
    text: string;
    atMobiles: string[];
    isAtAll: boolean;
  };
  at?: {
    atMobiles: string[];
    isAtAll: boolean;
  };
}

export interface DingTalkActionCard {
  msgtype: 'actionCard';
  actionCard: {
    title: string;
    text: string;
    singleTitle?: string;
    singleURL?: string;
    hideAvatar: '0' | '1';
    btnOrientation: '0' | '1';
    btns?: Array<{
      title: string;
      actionURL: string;
    }>;
  };
}

export interface DingTalkFeedCardItem {
  msgtype: 'feedCard';
  feedCard: {
    title: string;
    messageURL: string;
    picURL: string;
  };
}

export type DingTalkMessageType = DingTalkText | DingTalkLink | DingTalkMarkdown | DingTalkActionCard | DingTalkFeedCardItem;
