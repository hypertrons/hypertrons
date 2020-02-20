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

// Issue number must be a string contains 6 ascii chars(number or capital alpha), and its first one is 'I', like 'I192YQ'
// Convert string form issue number into number form. Turn each char to its ascii code, and then concat all number into one.
// e.g. I192YQ => 734957508981
export function convertIssueNumber2Number(issueNumber: string): number {
  return parseInt('' + issueNumber.charCodeAt(0) + issueNumber.charCodeAt(1) + issueNumber.charCodeAt(2) + issueNumber.charCodeAt(3) + issueNumber.charCodeAt(4) + issueNumber.charCodeAt(5));
}

// convert number form issue number into origin string form. Extract every two number and turn them to ascii char.
// e.g. 734957508981 => I192YQ
export function convertIssueNumber2String(issueNumber: number): string {
  const nums: number[] = [];
  while (issueNumber >= 1) {
    nums.unshift(issueNumber % 100);
    issueNumber = Math.floor(issueNumber / 100);
  }
  return String.fromCharCode(...nums);
}

// some char in URL will affect http request URL.
// have to replace them.
// e.g. some labels contains '/' like 'pull/approved' will lead to labels update failure
export function encodeURL(str: string) {
  return escape(str).replace(/\+/g, '%2B').replace(/\"/g, '%22').replace(/\'/g, '%27').replace(/\//g, '%2F');
}
