-- Copyright 2019 Xlab
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

-- Auto label on issue/pull open/edit
local autoLabel = function (e)
  if(e.action == 'opened' or e.action == 'edited') then
    local l = {}
    local labels = config['label-setup'].labels
    local title = string.lower(e.title)
    for i= 1, #labels do
      if(labels[i].keywords ~= nil and arrayContains(labels[i].keywords, function (keyword)
        return string.find(title, escapeLuaString(keyword)) ~= nil
      end)) then
        table.insert(l, labels[i].name)
      end
    end
    if(#l > 0) then
      log('Gonna add', #l, 'labels to', e.number)
      addLabels(e.number, l)
    end
  end
end
on('IssueEvent', autoLabel)
on('PullRequestEvent', autoLabel)
