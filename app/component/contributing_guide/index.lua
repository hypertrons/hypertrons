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

on('CommandEvent', function (e)
  if (e.command == compConfig.contributingGuideCommand) then
    -- some variables
    local newBranchName = compConfig.newBranchName
    local filePath = compConfig.filePath
    local commitMessage = compConfig.commitMessage
    local guideContent = compConfig.header..compConfig.body..compConfig.content
    local guideContentRender = rendStr(guideContent, {
      ['repoName'] = getData().name
    })
    -- checkout a new branch, then create file on the new branch.
    newBranch(newBranchName, compConfig.defaultBranch)
    createOrUpdateFile(filePath, guideContentRender, commitMessage, newBranchName)
  end
end)
