import * as template from './folder-add-edit.component.html';

import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';

import { Angulartics2 } from 'angulartics2';
import { ToasterService } from 'angular2-toaster';

import { FolderService } from 'jslib/abstractions/folder.service';
import { I18nService } from 'jslib/abstractions/i18n.service';

import { FolderView } from 'jslib/models/view/folderView';

@Component({
    selector: 'app-folder-add-edit',
    template: template,
})
export class FolderAddEditComponent implements OnInit {
    @Input() folderId: string;
    @Output() onSavedFolder = new EventEmitter<FolderView>();
    @Output() onDeletedFolder = new EventEmitter<FolderView>();

    editMode: boolean = false;
    folder: FolderView = new FolderView();

    constructor(private folderService: FolderService, private i18nService: I18nService,
        private analytics: Angulartics2, private toasterService: ToasterService) { }

    async ngOnInit() {
        this.editMode = this.folderId != null;

        if (this.editMode) {
            this.editMode = true;
            const folder = await this.folderService.get(this.folderId);
            this.folder = await folder.decrypt();
        }
    }

    async save() {
        if (this.folder.name == null || this.folder.name === '') {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('nameRequired'));
            return;
        }

        const folder = await this.folderService.encrypt(this.folder);
        await this.folderService.saveWithServer(folder);
        this.analytics.eventTrack.next({ action: this.editMode ? 'Edited Folder' : 'Added Folder' });
        this.toasterService.popAsync('success', null,
            this.i18nService.t(this.editMode ? 'editedFolder' : 'addedFolder'));
        this.onSavedFolder.emit(this.folder);
    }

    async delete() {
        if (!confirm(this.i18nService.t('deleteFolderConfirmation'))) {
            return;
        }

        await this.folderService.deleteWithServer(this.folder.id);
        this.analytics.eventTrack.next({ action: 'Deleted Folder' });
        this.toasterService.popAsync('success', null, this.i18nService.t('deletedFolder'));
        this.onDeletedFolder.emit(this.folder);
    }
}
