-- Copyright 2019 - present Xlab
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

-- Auto merge pull by approve command

if (config['approve'] ~= nil and config['approve'].label ~= nil) then 
  sched(compConfig.schedName, compConfig.sched, function ()
    local data = getData()
    if (data == nil) then -- data not ready yet
      return
    end
    for i= 1, #data.pulls do
      local pull = data.pulls[i]
      -- if the pull is still open and have config['approve'].label (default: pull/approved), try merge it
      if (pull.closedAt == nil and arrayContains(pull.labels, function (l)
        return l == config['approve'].label
      end)) then
        merge(pull.number)
      end
    end
  end)
else
  log("Not set approve.label in config, skip " .. compName)
end

