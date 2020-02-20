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

-- Difficuty command
if (config['label_setup'] ~= nil and config['label_setup'].labels ~= nil) then
  on('CommandEvent', function (e)
    if (e.command == compConfig.command) then
      if (#e.params ~= 1) then
        return
      end
      local level = e.params[1]
      local label = 'difficulty/' .. level
      local labels = config['label_setup'].labels
      if (arrayContains(labels, function (l)
        return l.name == label
      end)) then
        addLabels(e.number, { label })
      end
    end
  end)
else
  log("Not set label_setup.labels in config, skip " .. compName)
end
