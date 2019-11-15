import { AppPluginBase } from "../../basic/AppPluginBase";
import { CommandManagerIssuesEvent } from "../event-manager/events";

export class AppCommandManager extends AppPluginBase<null>{
    public async onReady() {
        this.logger.info("command plugin is ready")
    }   
    
    public async onStart() {
        this.logger.info("command plugin is starting")
    }


    public async onClose() {
        this.logger.info("command plugin is closing")
    }

}