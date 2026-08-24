package ai.gabarita.admin;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class AdminContentControllerTest {
    @Test
    void canonicalizesAImportedDetailedTopicWithoutDuplicatingItsAliases() {
        assertEquals(
                "Sistemas Operacionais → Linux → Comandos de arquivos → touch e permissões",
                AdminContentController.canonicalDetailedTopic(
                        "Informática → Linux → Comandos de arquivos → touch e permissões",
                        "Informática", "Linux", "Sistemas Operacionais", "Linux"));
        assertEquals(
                "Computação em Nuvem → Armazenamento em Nuvem → Backup e versionamento",
                AdminContentController.canonicalDetailedTopic(
                        "Informática → Computação em Nuvem → Armazenamento em Nuvem → Backup e versionamento",
                        "Informática", "Armazenamento em Nuvem", "Computação em Nuvem", "Armazenamento em Nuvem"));
    }

    @Test
    void createsStableTaxonomySlugs() {
        assertEquals("tecnologia-da-informacao", AdminContentController.slug("Tecnologia da Informação"));
        assertEquals("gerenciamento-eletronico-de-documentos",
                AdminContentController.slug("Gerenciamento Eletrônico de Documentos"));
    }
}
