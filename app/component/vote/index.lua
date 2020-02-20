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
  local roles = splitByComma(params[2])
  for i=1, #roles do
    if checkRoleName(roles[i]) == false then
      return 'Role `' .. roles[i] .. '` not exist.'
    end
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
        local allRoles = metaData['participants']
        local hasRight = false
        for i=1, #allRoles do
          if checkLoginRole(allRoles[i], login) then
            hasRight = true
            break
          end
        end
        if hasRight then
          return '' -- Vote successfully
        else
          return 'Sorry you have no right to vote.'
        end
      end
    else
      return 'Invaild vote choice. Please check your spelling.'
    end
  else
    return 'Sorry currently there is no active vote.'
  end
end

-- <region>: VoteSummaryInfo
local joinTemplate = function(voteSummaryJson)
  local res = compConfig.voteSummaryStart
  for k,v in pairs(voteSummaryJson) do
    res = res .. rendStr(compConfig.choice, {['choiceName']=k})
    for kk, vv in pairs(v) do
      res = res .. rendStr(compConfig.voter, {['login']=kk})
    end
  end
  return res .. compConfig.voteSummaryEnd
end

local joinJson = function(voteSummaryJson)
  return compConfig.voteJsonStart .. table2string(voteSummaryJson) .. compConfig.voteJsonEnd
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
  local VoteSummaryJsonRegExp = compConfig.voteSummaryJsonRegExp
  local VoteSummaryInfoRegExp = compConfig.voteSummaryInfoRegExp
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
    local vsj = string2table(voteSummaryJson)
    if updateVote(vsj, login, choice) then
      commentBody = string.gsub(commentBody, VoteSummaryInfoRegExp, joinTemplate(vsj))
      commentBody = string.gsub(commentBody, VoteSummaryJsonRegExp, joinJson(vsj))
      updateIssueComment(comment_id, commentBody)
    end
  end
end
-- <region end>: VoteSummaryInfo


on('CommandEvent', function (e)
  if (e.command == compConfig.startVoteCommand) then
    local info = checkStartVote(e.number, e.params)
    if info == '' then
      if updateCommentAnnotation('info', e.number, e.comment_id, 'Start a new vote successfully.') then
        local voteInfo = {
          ['choices'] = splitByComma(e.params[1]),
          ['participants'] = splitByComma(e.params[2]),
          ['duration'] = convertDuration(e.params[3]),
          ['launchTime'] =  getNowTime(),
          ['comment_id'] = e.comment_id
        }
        updateIssueMetaData(e.number, voteInfo)
        addLabels(e.number, { compConfig.votingLabelName })
      end
    else
      if e.comment_id then -- Tell user their mistake
        updateCommentAnnotation('error', e.number, e.comment_id, info)
      end
    end
  elseif (e.command == compConfig.voteCommand) then
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

-- regularly check
sched(compConfig.voteSchedName, compConfig.voteSched, function ()
  local issuesNumber = getIssuesNumber()
  for i=1, #issuesNumber do
    local metaData = getIssueMetaData(issuesNumber[i])
    if metaData ~= {} and metaData['launchTime'] and metaData['duration'] then
      -- check whether it's out of date
      if toNowNumber(metaData['launchTime']) > metaData['duration'] then
        addLabels(issuesNumber[i], { compConfig.votedLabelName })
        removeLabel(issuesNumber[i], compConfig.votingLabelName)
      end
    end
  end
end)
