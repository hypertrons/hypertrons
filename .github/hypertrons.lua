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
      addLabels(e.number, l)
    end
  end
end
on('IssueEvent', autoLabel)
on('PullRequestEvent', autoLabel)

-- Issue reminder
sched('Issue reminder', '0 0 9 * * *', function ()
  local data = getData()
  if (data == nil) then -- data not ready yet
    return
  end
  local users = getRoles('replier')
  if (#users == 0) then
    return
  end
  local msg = 'This issue has not been replied for 24 hours, please pay attention to this issue: '
  for i= 1, #users do
    msg = msg .. '@' .. users[i] .. ' '
  end
  for i= 1, #data.issues do
    local issue = data.issues[i]
    -- filter rule: 1. still open 2. has no comments 3. opened before 24 hours
    if (issue.closedAt == nil and #issue.comments == 0 and toNow(issue.createdAt) > 24 * 60 * 60 * 1000) then
      addIssueComment(issue.number, msg)
    end
  end
end)

on('CommandEvent', function (e)
  -- Difficuty command
  if (e.command == '/difficulty') then
    if (#e.params ~= 1) then
      return
    end
    local level = e.params[1]
    local label = 'difficulty/' .. level
    local labels = config['label-setup'].labels
    if (arrayContains(labels, function (l)
      return l.name == label
    end)) then
      addLabels(e.number, { label })
    end
  end
end)

local approveLabel = 'pull/approved'
-- Approve command, add pull/approved label
on('CommandEvent', function (e)
  if (e.command == '/approve') then
    addLabels(e.number, { approveLabel })
  end
end)

-- Run CI pipeline
on('CommandEvent', function (e)
  if (e.command == '/rerun') then
    if (#e.params ~= 1) then
      return
    end
    runCI(e.params[1], e.number)
  end
end)

-- Auto merge pull by approve command, check every hour
sched('Auto merge', '0 0 */1 * * *', function ()
  local data = getData()
  if (data == nil) then -- data not ready yet
    return
  end
  for i= 1, #data.pulls do
    local pull = data.pulls[i]
    -- if the pull is still open and have pull/approved label, try merge it
    if (pull.closedAt == nil and arrayContains(pull.labels, function (l)
      return l == approveLabel
    end)) then
      merge(pull.number)
    end
  end
end)
