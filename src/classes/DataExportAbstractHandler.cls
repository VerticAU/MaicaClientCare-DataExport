public abstract class DataExportAbstractHandler extends AbstractProcessor {

    public String action;
    public DTO payload;
    public String exportSettingName;
    public Data_Export_Setting__mdt exportSetting;
    public Integer limitVar;


    public abstract List<Object> getExportEntities();

    public virtual void init() {
    }
    public virtual void getExportData(){
    }
    public virtual void exportPostProcess() {
    }
    public virtual List<Map<String, String>> populateFileContent(List<Map<String, String>> rows) {
        return rows;
    }
    public virtual DataExportService.XMLContent populateFileContent(DataExportService.XMLContent content) {
        return content;
    }

    public virtual override Response process(Request request) {
        this.request = request;
        this.action = this.request.getRequiredString('action');
        this.exportSetting = (Data_Export_Setting__mdt) Utils.arrays.firstOrException(
                [SELECT Id, Label, DeveloperName, Format__c, Chunk_Limit__c FROM Data_Export_Setting__mdt WHERE DeveloperName = :this.exportSettingName],
                'No Data_Export_Setting__mdt with Name: ' + this.exportSettingName
        );
        this.limitVar = Utils.objects.defaultIfNull(this.exportSetting.Chunk_Limit__c, 5000.00).intValue();

        if('init'.equals(this.action.toLowerCase())) {
            this.init();

        } else if ('get'.equalsIgnoreCase(this.action.toLowerCase())) {
            List<Object> exportEntities = this.getExportEntities();
            this.payload.put('entities', exportEntities);
            List<Object> chunks = this.splitExportEntities(new List<Object>(exportEntities));
            this.response.put('chunks', chunks);

        } else if ('export'.equalsIgnoreCase(this.action.toLowerCase())) {
            String fileId = this.export();
            this.response.put('fileId', fileId);
        }

        return this.response;
    }

    public virtual List<Object> splitExportEntities(List<Object> entities) {
        List<Object> chunks = new List<Object>();
        Integer totalSize = entities.size();

        if(totalSize == 0){
            return null;
        }

        Integer index = 0;

        while (index < totalSize) {
            Integer endIndex = Math.min(index + this.limitVar, totalSize);
            List<Object> entitiesChunk = new List<Object>();

            for (Integer i = index; i < endIndex; i++) {
                entitiesChunk.add(entities[i]);
            }

            Map<String, Object> payload = this.payload.getMap().clone();
            payload.put('entities', entitiesChunk);
            payload.put('index', chunks.size() + 1);

            chunks.add(new Map<String, Object>{
                    'startIndex' => index + 1,
                    'endIndex' => endIndex,
                    'payload' => payload
            });

            index = endIndex;
        }

        return chunks;
    }

    public virtual String export() {
        this.getExportData();
        String fileContent = '';

        if ('XML'.equals(this.exportSetting.Format__c)) {
            fileContent = this.processXML();

        } else if ('CSV'.equals(this.exportSetting.Format__c)) {
            fileContent = this.processCSV();
        }

        String fileId = this.createFile(fileContent);
        this.exportPostProcess();

        return fileId;
    }

    public virtual String processXML() {
        String fileContent = '';
        DataExportService.XMLContent dexContent = new DataExportService.XMLContent();
        dexContent = this.populateFileContent(dexContent);
        fileContent = dexContent.xml;
        return fileContent;
    }

    public virtual String processCSV() {
        String fileContent = '';
        List<Map<String, String>> rows = new List<Map<String, String>>();
        rows = this.populateFileContent(rows);

        if (rows.size() == 0) {
            fileContent = 'There are no available records.';

        } else {
            String headerRow = String.join(new List<String>(rows[0].keySet()), ',').removeEnd(',');
            String contentRows = '';

            for (Map<String, String> row : rows) {
                contentRows += String.join(row.values(), ',').removeEnd(',') + '\n';
            }

            contentRows.removeEnd('\n');
            fileContent = headerRow + '\n' + contentRows;
        }

        return fileContent;
    }

    public virtual String createFile(String fileContent) {
        String title = this.exportSetting.Label + ' ' + (Datetime.newInstance(Date.today(), Time.newInstance(0, 0, 0, 0)))?.format('YYYY-MM') + '.' + this.exportSetting.Format__c.toLowerCase();

        ContentVersion cv = new ContentVersion(
                VersionData = Blob.valueOf(fileContent),
                Title = title,
                PathOnClient = title
        );
        insert cv;

        ContentVersion cvFileInserted = [
                SELECT Id, ContentDocumentId
                FROM ContentVersion
                WHERE Id = :cv.Id
        ];

        return cvFileInserted.ContentDocumentId;
    }
}