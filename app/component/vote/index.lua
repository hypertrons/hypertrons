-- Copyright 2020 Xlab
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

local splitChoices = function(choices)
  -- In: A,B,C,D
  -- Out:[A, B, C, D]
  local res = {}
  for c in string.gmatch(choices, '([^,]+)') do
    table.insert(res, c)
  end
  return res
end


local convertDuration = function(dur)
    local endChar = string.sub(dur, -1)
    local res = tonumber(string.sub(dur, 1, -2))
    if (endChar == 'h') then
      res = res * 60 * 60 * 1000
    elseif (endChar == 'd') then
      res = res * 24 * 60 * 60 * 1000
    end
    return res
end


local checkStartVote = function (issueNumber, params)
  if #params ~= 3 then
    return 'Starting a vote needs exactly THREE parameters.'
  end
  if checkRoleName(params[2]) == false then
    return 'Role `' .. params[2] .. '` not exist.'
  end
  if string.match(params[3], '^[1-9]%d*[d|h]$') == nil then
    return 'Due date should start with a number and end with day or hour just like 30h or 2d.'
  end
  return ''
end


local checkLoginRole = function(participants, login)
  if participants == 'anyone' then
    return true
  end
  local users = getRoles(participants)
  if arrayContains(users, function(user)
    return user == login
  end) then
    return true
  else
    return false
  end
end


local checkVote = function(metaData, issueNumber, login, params)
  -- check params number
  if #params ~= 1 then
    return 'Voting needs exactly ONE parameters.'
  end
  -- check whether this issue has an active voting.
  if metaData['choices'] then
    if arrayContains(metaData['choices'], function(c)
      return c == params[1]
    end) then
      -- check whether it's out of date
      if (toNowNumber(metaData['launchTime']) > metaData['duration']) then
        return 'Sorry, voting has been Out-of-Date.'
      else
        -- check whether this login has right to vote.
        if checkLoginRole(metaData['participants'], login) == false then
          return 'Sorry you have no right to vote.'
        else
          return '' -- Vote successfully
        end
      end
    else
      return 'Invaild vote choice. Please check your spelling.'
    end
  else
    return 'Sorry currently there is no active vote.'
  end
end

-- Currently we don't support to pass multilayer table to typescript.
-- These two function will be removed \
-- When we support multilayer table or table2string/string2table function in lua
local mystring2table = function(str)
  local tbl = string2table(str)
  for k,v in pairs(tbl) do
    tbl[k] = string2table(v)
  end
  return tbl
end


local mytable2string = function(tbl)
  for k,v in pairs(tbl) do
    tbl[k] = table2string(v)
  end
  return table2string(tbl)
end


-- <region>: VoteSummaryInfo
local joinTemplate = function(voteSummaryJson)
  local res = config['vote']['voteSummaryStart']
  for k,v in pairs(voteSummaryJson) do
    res = res .. rendStr(config['vote']['choice'], {['choiceName']=k})
    for kk, vv in pairs(v) do
      res = res .. rendStr(config['vote']['voter'], {['login']=kk})
    end
  end
  return res .. config['vote']['voteSummaryEnd']
end

local joinJson = function(voteSummaryJson)
  return config['vote']['voteJsonStart'] .. mytable2string(voteSummaryJson) .. config['vote']['voteJsonEnd']
end

local updateVote = function(voteSummaryJson, login, choice)
  -- We need to check whether this login has voted.
  local add = true
  for c,v in pairs(voteSummaryJson) do
    if v[login] ~= nil then
      if c == choice then -- just do nothing.
        return false
      else -- remove first, then add.
        voteSummaryJson[c][login] = nil
      end
      break
    end
  end
  if add then
    voteSummaryJson[choice][login] = login
    return true
  end
end


local updateVoteSummaryInfo = function(number, comment_id, choices, login, choice)
  local commentBody = getIssueComment(number, comment_id)
  if commentBody == '' then -- failed to get comment body
    return
  end
  local VoteSummaryJsonRegExp = config['vote']['voteSummaryJsonRegExp']
  local VoteSummaryInfoRegExp = config['vote']['voteSummaryInfoRegExp']
  local voteSummaryJson = string.match(commentBody, VoteSummaryJsonRegExp)
  if voteSummaryJson == nil then
    voteSummaryJson = {}
    for i=1, #choices do
      voteSummaryJson[choices[i]] = {}
    end
    voteSummaryJson[choice][login] = login
    commentBody = commentBody .. joinTemplate(voteSummaryJson) .. joinJson(voteSummaryJson)
    updateIssueComment(comment_id, commentBody)
  else
    local vsj = mystring2table(voteSummaryJson)
    if updateVote(vsj, login, choice) then
      commentBody.replace(VoteSummaryInfoRegExp, joinTemplate(vsj))
      commentBody.replace(VoteSummaryJsonRegExp, joinJson(vsj))
      updateIssueComment(comment_id, commentBody)
    end
  end
end
-- <region end>: VoteSummaryInfo


on('CommandEvent', function (e)
  if (e.command == '/start-vote') then
    local info = checkStartVote(e.number, e.params)
    if info == '' then
      if updateCommentAnnotation('info', e.number, e.comment_id, 'Start a new vote successfully.') then
        local voteInfo = {
          ['choices'] = splitChoices(e.params[1]),
          ['participants'] = e.params[2],
          ['duration'] = convertDuration(e.params[3]),
          ['launchTime'] =  getNowTime(),
          ['comment_id'] = e.comment_id
        }
        updateIssueMetaData(e.number, voteInfo)
        addLabels(e.number, { 'voting' })
      end
    else
      if e.comment_id then -- Tell user their mistake
        updateCommentAnnotation('error', e.number, e.comment_id, info)
      end
    end
  elseif (e.command == '/vote') then
    local metaData = getIssueMetaData(e.number)
    local info = checkVote(metaData, e.number, e.login, e.params)
    if info == '' then
      if updateCommentAnnotation('info', e.number, e.comment_id, 'Vote successfully') then
        updateVoteSummaryInfo(e.number, metaData['comment_id'], metaData['choices'], e.login, e.params[1])
      end
    else
      updateCommentAnnotation('error', e.number, e.comment_id, info)
    end
  end
end)

-- -- regularly check
-- sched(compConfig.schedName, compConfig.sched, function ()
--   local issuesNumber = getIssuesNumber()
--   for i=1, #issuesNumber do
--     local metaData = getIssueMetaData(issuesNumber[i])
--     -- check whether it's out of date
--     if (toNowNumber(metaData['launchTime']) > metaData['duration']) then
--       addLabels(issuesNumber[i], { 'vote end' })
--     else
--   end
-- end)
