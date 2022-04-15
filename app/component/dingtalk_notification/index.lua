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

-- Dingtalk notification

local newLine = '  \n  '

local getRepoText = function (repository)
  return '[[' .. repository.name .. ']]('
    .. repository.html_url
    .. ')'
end

local getUserText = function (user)
  local text = '[' .. user.login .. '](' .. user.html_url .. ')'
  for i=1, #compConfig.ids do
    if(compConfig.ids[i].github_login == user.login) then
      text = text .. '(@' .. compConfig.ids[i].dingtalk_id .. ')'
    end
  end
  return text
end

local getIssuePullTitle = function (issue)
  local text = '[#' .. tostring(math.floor(issue.number)) .. ' ' .. issue.title
    .. '](' .. issue.html_url .. ')'
  if (#issue.assignees > 0) then
    text = text .. '(assigned to '
    for i=1, #issue.assignees do
      text = text .. getUserText(issue.assignees[i]) .. ' '
    end
    text = text .. ')'
  end
  return text
end

local getBody = function (body)
  local subBody = subStringUTF8(body, 1, compConfig.maxBodyLength)
  if (string.len(subBody) ~= string.len(body)) then
    subBody = subBody .. '...'
  end
  return subBody
end

local addAtUser = function (user, atUsers)
  if (#compConfig.ids == 0) then return end
  for i=1, #compConfig.ids do
    if(compConfig.ids[i].github_login == user.login) then
      atUsers[compConfig.ids[i].dingtalk_id] = true
    end
  end
end

local addAtUserForIssue = function (issue, atUsers)
  if (#issue.assignees > 0) then
    for i=1, #issue.assignees do
      addAtUser(issue.assignees[i], atUsers)
    end
  end
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

on('IssueEvent', function (e)
  local payload = e.rawPayload
  local atUsers = {}
  addAtUser(payload.sender, atUsers)
  addAtUserForIssue(payload.issue, atUsers)
  if (payload.action == 'opened' and arrayContainsItem(compConfig.types, 'open_issue')) then
    local text = getRepoText(payload.repository) .. ' Issue created by '
      .. getUserText(payload.sender) .. ' '
      .. getIssuePullTitle(payload.issue) .. newLine .. getBody(payload.issue.body)
      sendMsg(text, atUsers)
  elseif (payload.action == 'closed' and arrayContainsItem(compConfig.types, 'close_issue')) then
    local text = getRepoText(payload.repository) .. ' Issue closed by '
      .. getUserText(payload.sender) .. ' '
      .. getIssuePullTitle(payload.issue)
      sendMsg(text, atUsers)
  elseif (payload.action == 'assigned' and arrayContainsItem(compConfig.types, 'issue_assign')) then
    local text = getRepoText(payload.repository) .. ' Issue assigned to '
      .. getUserText(payload.assignee) .. ' by ' .. getUserText(payload.sender) .. ' '
      .. getIssuePullTitle(payload.issue)
      addAtUser(payload.assignee, atUsers)
      sendMsg(text, atUsers)
  end
end)
on('PullRequestEvent', function (e)
  local payload = e.rawPayload
  local atUsers = {}
  addAtUser(payload.sender, atUsers)
  addAtUserForIssue(payload.pull_request, atUsers)
  if (payload.action == 'opened' and arrayContainsItem(compConfig.types, 'open_pull')) then
    local text = getRepoText(payload.repository) .. ' Pull request created by '
      .. getUserText(payload.sender) .. ' '
      .. getIssuePullTitle(payload.pull_request) .. newLine .. getBody(payload.pull_request.body)
      sendMsg(text, atUsers)
  elseif (payload.action == 'closed' and arrayContainsItem(compConfig.types, 'close_pull')) then
    local text = getRepoText(payload.repository) .. ' Pull request closed by '
      .. getUserText(payload.sender) .. ' '
      .. getIssuePullTitle(payload.pull_request)
      sendMsg(text, atUsers)
  elseif (payload.action == 'assigned' and arrayContainsItem(compConfig.types, 'pull_assign')) then
    local text = getRepoText(payload.repository) .. ' Pull request assigned to '
      .. getUserText(payload.assignee) .. ' by ' .. getUserText(payload.sender) .. ' '
      .. getIssuePullTitle(payload.pull_request)
      addAtUser(payload.assignee)
      sendMsg(text, atUsers)
  end
end)
on('IssueCommentEvent', function (e)
  local payload = e.rawPayload
  local atUsers = {}
  addAtUser(payload.sender, atUsers)
  local issue = payload.issue
  if (issue == nil) then
    issue = payload.pull_request
  end
  addAtUserForIssue(issue, atUsers)
  if (payload.action == 'created' and arrayContainsItem(compConfig.types, 'create_issue_comment')) then
    local text = getRepoText(payload.repository) .. ' New comment by '
      .. getUserText(payload.sender) .. ' on issue ' .. getIssuePullTitle(issue)
      .. newLine .. getBody(payload.comment.body)
      sendMsg(text, atUsers)
  elseif (payload.action == 'edited' and arrayContainsItem(compConfig.types, 'update_issue_comment')) then
    local text = getRepoText(payload.repository) .. ' Comment updated by '
      .. getUserText(payload.sender) .. ' on issue ' .. getIssuePullTitle(issue)
      .. newLine .. getBody(payload.comment.body)
      sendMsg(text, atUsers)
  end
end)
on('ReviewCommentEvent', function (e)
  local payload = e.rawPayload
  local atUsers = {}
  addAtUser(payload.sender, atUsers)
  addAtUserForIssue(payload.pull_request, atUsers)
  if (payload.action == 'created' and arrayContainsItem(compConfig.types, 'create_review_comment')) then
    local text = getRepoText(payload.repository) .. ' New review comment created by '
      .. getUserText(payload.sender) .. ' on pull request ' .. getIssuePullTitle(payload.pull_request)
      .. newLine .. getBody(payload.comment.body)
      sendMsg(text, atUsers)
  elseif (payload.action == 'edited' and arrayContainsItem(compConfig.types, 'update_review_comment')) then
    local text = getRepoText(payload.repository) .. ' Review comment updated by '
      .. getUserText(payload.sender) .. ' on pull request ' .. getIssuePullTitle(payload.pull_request)
      .. newLine .. getBody(payload.comment.body)
      sendMsg(text, atUsers)
  end
end)
