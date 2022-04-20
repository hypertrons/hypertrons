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

-- Dingtalk weekly

local newLine = '  \n  '

local inLastWeek = function (t)
  return toNow(t) < 7 * 24 * 60 * 60 * 1000
end

local parseInteger = function (n)
  return tostring(math.floor(n))
end

local getUserText = function (login)
  local text = '[' .. login .. '](https://github.com/' .. login .. ')'
  if (compConfig.ids ~= nil) then
    for i=1, #compConfig.ids do
      if (compConfig.ids[i].github_login == login) then
        text = text .. '(@' .. compConfig.ids[i].dingtalk_id .. ')'
      end
    end
  end
  return text
end

local getOverview = function (data)
  local decorateChangeNumber = function (n)
    if (n) > 0 then n = n .. '↑'
    else n = '-'
    end
    return '(' .. n .. ')'
  end
  local newStarsCount = decorateChangeNumber(#arrayFilter(data.stars, function (s) return inLastWeek(s.time) end))
  local newForksCount = decorateChangeNumber(#arrayFilter(data.forks, function (f) return inLastWeek(f.time) end))
  local newContributorsCount = decorateChangeNumber(#arrayFilter(data.contributors, function (c) return inLastWeek(c.time) end))
  return '|Watch|Star|Fork|Contributors|' .. newLine
    .. '|--|--|--|--|' .. newLine
    .. '|' .. parseInteger(data.watchCount) 
    .. '|' .. parseInteger(data.starCount) .. newStarsCount
    .. '|' .. parseInteger(data.forkCount) .. newForksCount
    .. '|' .. #data.contributors .. newContributorsCount .. '|' .. newLine
end

local getIssues = function (data)
  local ret = 'There is no active issues on this repository last week.' .. newLine
  if (#data.issues == 0) then return ret end;
  local issues = arrayFilter(data.issues, function (i)
    return inLastWeek(i.updatedAt)
  end)
  if (#issues == 0) then return ret end
  ret = '|Issue|Status|' .. newLine
    .. '|--|--|' .. newLine
  for _, i in ipairs(issues) do
    local status = 'open'
    if (i.closedAt ~= nil) then status = 'closed' end
    ret = ret .. '|#' .. parseInteger(i.number) .. ' ' .. subStringUTF8(i.title, 1, compConfig.maxTitleLength)
      .. '...|' .. status .. '|' .. newLine
  end
  return ret
end

local addAtUser = function (login, atUsers)
  if (#compConfig.ids == 0) then return end
  for i=1, #compConfig.ids do
    if(compConfig.ids[i].github_login == login) then
      atUsers[compConfig.ids[i].dingtalk_id] = true
    end
  end
end

local getPulls = function (data, atUsers)
  local ret = 'There is no active pull request on this repository last week.' .. newLine
  if (#data.pulls == 0) then return ret end;
  local pulls = arrayFilter(data.pulls, function (p)
    return inLastWeek(p.updatedAt)
  end)
  if (#pulls == 0) then return ret end
  ret = '|PR|Author|Status|' .. newLine
    .. '|--|--|--|' .. newLine
  for _, p in ipairs(pulls) do
    local status = 'open'
    if (p.mergedAt ~= nil) then status = 'merged'
    elseif (p.closedAt ~= nil) then status = 'closed' end
    ret = ret .. '|#' .. parseInteger(p.number) .. ' ' .. subStringUTF8(p.title, 1, compConfig.maxTitleLength) .. '...|'
      .. getUserText(p.author) .. '|' .. status .. '|' .. newLine
    addAtUser(p.author, atUsers)
  end
  return ret
end

local getContributors = function (data, atUsers)
  local ret = 'There are no new contributors in the past week.'
  if (data.contributors == nil or #data.contributors == 0) then return ret end
  local contributors = arrayFilter(data.contributors, function (c) return inLastWeek(c.time) end)
  if (#contributors == 0) then return ret end
  ret = 'Welcomes to ' .. #contributors .. ' new contributors to our community.' .. newLine 
    .. '|Login|First time|' .. newLine
    .. '|--|--|' .. newLine
  for _, c in ipairs(contributors) do
    ret = ret .. '|' .. getUserText(c.login) .. '|' .. c.time .. '|' .. newLine
    addAtUser(c.login, atUsers)
  end
  return ret
end

local sendMsg = function (text, atUsers)
  local msg = {
    ['msgtype'] = 'markdown',
    ['markdown'] = {
      ['text'] = text
    },
    ['at'] = {
      ['atMobiles'] = {},
      ['isAtAll'] = false
    }
  }
  for u, v in pairs(atUsers) do
    table.insert(msg['at']['atMobiles'], u)
  end
  sendToDingTalk(compConfig.dingTalkChannel, msg)
end

sched(compConfig.schedName, compConfig.sched, function ()
  local data = getData()
  if (data == nil) then -- data not ready yet
    return
  end
  local atUsers = {}
  local fullName = data.owner .. '/' .. data.name
  local text = '# Weekly Report of [' .. fullName .. '](https//github.com/' .. fullName .. ')' .. newLine
    .. 'This is a brief weekly report of the repository for last week.' .. newLine
    .. '## Overview' .. newLine
    .. getOverview(data) .. newLine
    .. '## Active issues' .. newLine
    .. getIssues(data) .. newLine
    .. '## Active PRs' .. newLine
    .. getPulls(data, atUsers) .. newLine
    .. '## Contributors' .. newLine
    .. getContributors(data, atUsers)
  sendMsg(text, atUsers)
end)
