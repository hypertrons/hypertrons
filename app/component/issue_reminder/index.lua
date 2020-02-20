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

-- Issue reminder
sched(compConfig.schedName, compConfig.sched, function ()
  local data = getData()
  if (data == nil) then -- data not ready yet
    return
  end
  local users = getRoles(compConfig.reminderRole)
  local labels = compConfig.ignore
  if (#users == 0) then
    return
  end
  local msg = compConfig.message
  for i= 1, #users do
    msg = msg .. '@' .. users[i] .. ' '
  end
  for i= 1, #data.issues do
    local issue = data.issues[i]
    -- filter rule: 1. still open 2. has no comments 3. opened before 24 hours
    -- 4. issue does not contains ignore labels 5. issue author is not a replier.
    if (issue.closedAt == nil and #issue.comments == 0 and toNow(issue.createdAt) > 24 * 60 * 60 * 1000
        and not arrayContains(issue.labels, 
        function (l1) 
          return arrayContains(labels, function (l2) return l2 == l1 end)
        end)
        and not arrayContains(users, function (u) return u == issue.author end)) then
      addIssueComment(issue.number, msg)
    end
  end
end)
